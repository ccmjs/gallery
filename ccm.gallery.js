'use strict';

/**
 * @overview <i>ccm</i>-based Web Component for a Gallery with a 5-Star Rating.
 * @author André Kless <andre.kless@web.de> 2025
 * @license The MIT License (MIT)
 */

ccm.files['ccm.gallery.js'] = {
  name: 'gallery',
  ccm: '././libs/ccm/ccm.js',
  config: {
    data: {
      store: ['ccm.store', {
        local: {
          animals: {
            key: 'animals',
            title: 'Gallerie der Tiere',
            items: [
              {
                title: 'Schaf',
                image: '././resources/images/sheep.jpg',
                description: 'Ein Schaf ist ein Haustier.',
                ratings: {
                  mandy: 5,
                  andy: 4,
                  candy: 2
                }
              },
              {
                title: 'Robbe',
                image: '././resources/images/seal.jpg',
                description: 'Eine Robbe ist ein Meeresbewohner.',
                ratings: {
                  mandy: 1,
                  andy: 4,
                  candy: 5
                }
              },
              {
                title: 'Igel',
                image: '././resources/images/hedgehog.jpg',
                description: 'Ein Igel ist ein Wildtier.',
                ratings: {
                  mandy: 5,
                  andy: 4,
                  candy: 4
                }
              },
            ],
          },
        },
      }],
      key: 'animals'
    },
    html: ['ccm.load', '././resources/templates.html'],
    css: ['ccm.load', '././resources/styles.css'],
    user: ['ccm.start', '././libs/fb02user/ccm.fb02user.js'],
  },
  Instance: function () {
    let data;
    this.start = async () => {
      data = await this.data.store.get(this.data.key);
      this.element.innerHTML = '';
      this.element.appendChild(this.ccm.helper.html(this.html.main, {title: data.title}));
      const $items = this.element.querySelector('#items');
      data.items.forEach(item => {
        const ratings = Object.values(item.ratings);
        const own = item.ratings[this.user.getValue().key];
        const amount = Object.keys(item.ratings).length;
        const average = ratings.reduce((a, b) => a + b) / amount;
        const $item = this.ccm.helper.html(this.html.item, {...item, amount});
        this.renderStars(own, $item.querySelector('.own.rating'), item);
        this.renderStars(average, $item.querySelector('.average .rating'));
        $items.appendChild($item);
      });
      this.element.querySelector('#user').appendChild(this.user.root);
    };
    this.renderStars = (rating, elem, item) => {
      elem.innerHTML = '';
      for (let i = 1; i <= 5; i++) {
        const star = rating >= i ? 'filled' : rating >= i - 0.5 ? 'half' : 'empty';
        const star_elem = this.ccm.helper.html(this.html['star_' + star]);
        item && star_elem.addEventListener('click', () => this.onRating(item, i));
        elem.appendChild(star_elem);
      }
    };
    this.onRating = async (item, stars) => {
      item.ratings[this.user.getValue().key] = stars;
      await this.data.store.set(data);
      await this.start();
    };
  }
};
